package com.weisong.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.weisong.backend.entities.Article;
import com.weisong.backend.entities.User;
import org.apache.ibatis.annotations.*;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:40
 */
@Mapper
@Repository
public interface ArticleMapper{

//    查询所有帖子
    List<Article> getAllArticle();

//

//    添加文章
    List<Article> addArticle(String article_uuid, String title, String article, Integer read, Integer like, Integer answer, Date createDate, Date updateDate, String name, String categoryId);

//    删除文章
    void deleteArticleById(@Param("article_uuid") String article_uuid);

}
