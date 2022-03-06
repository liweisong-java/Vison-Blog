package com.weisong.backend.service.impl;

import com.weisong.backend.entities.Article;
import com.weisong.backend.entities.User;
import com.weisong.backend.mapper.ArticleMapper;
import com.weisong.backend.service.ArticleService;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.BaseUserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:41
 */
@Service
public class ArticleServiceImpl implements ArticleService {

    @Autowired
    ArticleMapper articleMapper;

//  查询所有文章
    @Override
    public List<Article> getAllArticle() {
        List<Article> allArticle = articleMapper.getAllArticle();
        return allArticle;
    }

//    通过id查询文章
    @Override
    public Article getArticleByUuid(String articleUuid) {
        Article articleByUuid = articleMapper.getArticleByUuid(articleUuid);
        return articleByUuid;
    }

    //    阅读量+1
    @Override
    public void incView(String articleUuid) {
        articleMapper.incView(articleUuid);
    }

//  增加文章
    @Override
    public void addArticle(Article article) {
        articleMapper.addArticle(
                article.getArticleUuid(),
                article.getTitle(),
                article.getArticle(),
                article.getRead(),
                article.getLike(),
                article.getAnswer(),
                article.getCreateDate(),
                article.getUpdateDate(),
                BaseUserInfo.get("userUuid"),
                BaseUserInfo.get("name"),
                article.getCategoryId());
    }

//    通过id删除文章
    @Override
    public void deleteArticleById(String articleUuid) {
        articleMapper.deleteArticleById(articleUuid);
    }


}
