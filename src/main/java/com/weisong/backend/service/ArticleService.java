package com.weisong.backend.service;

import com.weisong.backend.entities.Article;
import com.weisong.backend.entities.User;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:41
 */
public interface ArticleService {

//    查询所有文章
    List<Article> getAllArticle();

//    添加文章
    List<Article> addArticle(Article article);

//    删除文章
    void deleteArticleById(@Param("uuid") String uuid);

}
